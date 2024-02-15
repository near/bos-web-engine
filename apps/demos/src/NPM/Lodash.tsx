import _ from 'lodash';
import partition from 'lodash/partition';

export default function () {
  return (
    <>
      {JSON.stringify(partition([1, 2, 3, 4], (n) => n % 2))}
      {JSON.stringify(_.defaults({ a: 1 }, { a: 3, b: 2 }))}
    </>
  );
}
