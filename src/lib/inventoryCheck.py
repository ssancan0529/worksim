import json
_cases = json.loads(_inventory_cases)
_source = str(_inventory_source)
_results = []
for _case in _cases:
    try:
        _namespace = {}
        exec(_source, _namespace)
        _value = _namespace['mover_stock'](_case['stock'], _case['cantidad'], _case['operacion'])
        if not isinstance(_value, dict) or type(_value.get('aceptado')) is not bool or type(_value.get('stock')) is not int:
            raise ValueError('Devuelve un diccionario con aceptado booleano y stock entero.')
        _results.append({'result': {'aceptado': _value['aceptado'], 'stock': _value['stock']}})
    except Exception as _error:
        _results.append({'error': str(_error)})
json.dumps(_results)
