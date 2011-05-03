# -*- coding: utf-8 -*-
from django.conf import settings
from django.utils import simplejson
from django.views.generic import ListView
from django.http import HttpResponse
from django.db import connection
from django.db.models import Q
from django.forms.fields import CharField

class QSearchListMixin(object):
    qsearch = None # FormClass

    def get_qsearch(self):
        return self.qsearch

    def check_logic(self, field_name, db_rule, val):
        """
        checks dome logic into field names
        ('FIELD_or_FIELD2','db_rule', val) -> {'FIELD__db_rule':val, 'FIELD2__db_rule':val}
        """
        resp = {}
        for name in field_name.split('_or_'):
            resp[name+db_rule] = val
        return resp

    def form_to_orm(self, qsearch_form):
        """ 
        magic to get field_name -> db_lookup rule
        name -> name__icontains
        """
        if not hasattr(qsearch_form, 'cleaned_data'):
            raise 'You have to valid your form'
        form_names_kwargs = qsearch_form.cleaned_data
        orm_names_kwargs = {}
        for field_name, val in form_names_kwargs.iteritems():
            if val:
                if isinstance(qsearch_form.fields[field_name], CharField):
                    _d = self.check_logic(field_name, '__icontains', val)
                else:
                    _d = self.check_logic(field_name, '', val)
                orm_names_kwargs.update(_d)
        return orm_names_kwargs

class BaseListView(ListView):
    paginate_by = 20 # fallback, you'd better use GET['per_page']

    def get_paginate_by(self, queryset=None): # what for - queryset?
        """
        adds param to standart paginate GET['per_page']
        """
        if not self.request.method == 'GET':
            return self.paginate_by

        per_page = self.request.GET.get('per_page', None)
        if per_page:
            try:
                per_page = int(per_page)
                return per_page
            except ValueError:
                pass
        return self.paginate_by

    def get_queryset(self):
        """
        adds sorting to standart one: GET['order'] & GET['is_rev']
        """
        queryset = super(BaseListView, self).get_queryset()

        if not self.request.method == 'GET':
            return queryset

        order = self.request.GET.get('order', 'pk') # TODO: default sorting-key -> from models?
        is_rev = bool(int(self.request.GET.get('is_rev', 0)))
        # TODO: error handling
        return queryset.order_by((is_rev and '-' or '') + (order))

class QSearchListView(QSearchListMixin, BaseListView):
    def get_context_data(self, **kwargs):
        context = super(QSearchListView, self).get_context_data(**kwargs)
        qsearch = self.get_qsearch()
        if not qsearch:
            return context
        context['form'] = qsearch()
        return context

    def get_queryset(self):
        queryset = super(QSearchListView, self).get_queryset() # ordered
        qsearch = self.get_qsearch()

        if not (self.request.method == 'GET' and qsearch):
            return queryset
        
        qsearch_form = qsearch(self.request.GET)

        if qsearch_form.is_valid():
            #for field, val in qsearch_form.cleaned_data.iteritems():
                #if val:
            orm_kwargs = self.form_to_orm(qsearch_form)
            if orm_kwargs:
                queryset = queryset.filter(Q(**orm_kwargs))

        return queryset

class BaseListViewJSONMixin(object):
    def render_to_response(self, context):
        return self.get_json_response(self.convert_context_to_json(context))

    def get_json_response(self, content, **httpresponse_kwargs):
        return HttpResponse(content,
                             content_type='application/json',
                             **httpresponse_kwargs)

    def convert_context_to_json(self, context):

        object_list = context.get('object_list', None)
        is_paginated = context.get('is_paginated', None)

        # TODO: handle errors & resp['code']
        resp = {'code': 1, 
                'objects': 'object_list' in context and self.object_list_to_jsonable(object_list) or [],
                }
        if is_paginated:
            paginator = context['paginator']
            page_obj = context['page_obj']
            resp['paginator'] = {'per_page': paginator.per_page, 
                    'page': page_obj.number, 
                    'total': paginator.num_pages, 
                    'total_objects': paginator.count 
                    }
        if settings.DEBUG:
            resp['queries'] = [query['sql'] for query in connection.queries if 'sql' in query]
            resp['page_query'] = [query['sql'] for query in connection.queries if 'sql' in query and query['sql'].find('LIMIT') > 0]
        return simplejson.dumps(resp)

    def object_list_to_jsonable(self, object_list):
        raise NotImplementedError()
