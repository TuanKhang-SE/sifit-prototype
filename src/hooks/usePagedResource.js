import { useCallback, useEffect, useState } from 'react';
import * as operations from '../services/operationsService';
import { getApiErrorMessage } from '../utils/errorHandler';

export default function usePagedResource(path, filters = {}) {
  const signature = JSON.stringify(filters);
  const [position, setPosition] = useState({ key: '', page: 1 });
  const key = `${path}:${signature}`;
  const page = position.key === key ? position.page : 1;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ key: '', items: [], pagination: {}, busy: true, error: '' });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    const requestKey = `${key}:${page}`;
    setState(previous => ({ ...previous, busy: true, error: '' }));
    operations.list(path, { ...JSON.parse(signature), page, limit: 20 }, controller.signal).then(result => {
      if (!controller.signal.aborted) setState({ key: requestKey, items: result.items || [], pagination: result.pagination || {}, busy: false, error: '' });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key: requestKey, items: [], pagination: {}, busy: false, error: getApiErrorMessage(error) });
    });
    return () => controller.abort();
  }, [path, signature, key, page, revision]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  const stale = state.key !== `${key}:${page}`;
  if (!path) return { items: [], pagination: {}, busy: false, error: '', page: 1, setPage: () => {}, reload };
  return { ...state, items: stale ? [] : state.items, pagination: stale ? {} : state.pagination, busy: stale || state.busy,
    page, setPage: value => setPosition({ key, page: value }), reload };
}
