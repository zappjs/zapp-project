import * as _ from 'lodash'

function customizer(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return srcValue;
  }
}

export default function merge(a, b) {
  if (Array.isArray(a)) {
    return b;
  } else if (typeof a === 'object') {
    return _.mergeWith(a, b, customizer);
  }
  return b;
}
