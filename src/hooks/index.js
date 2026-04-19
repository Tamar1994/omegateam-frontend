/**
 * Hooks Customizados - Reutilização de lógica
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * useAsync - Gerencia loading/error/data de requisições
 * 
 * Uso:
 * const { data, loading, error } = useAsync(() => fetchData(), []);
 */
export const useAsync = (fn, deps = []) => {
  const [state, setState] = useState({ data: null, loading: false, error: null });

  useEffect(() => {
    let mounted = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    fn()
      .then(data => {
        if (mounted) setState({ data, loading: false, error: null });
      })
      .catch(error => {
        if (mounted) setState({ data: null, loading: false, error });
      });

    return () => { mounted = false; };
  }, deps);

  return state;
};

/**
 * useForm - Gerencia estado de formulário
 * 
 * Uso:
 * const { values, errors, handleChange, handleSubmit } = useForm({
 *   initialValues: { email: '', senha: '' },
 *   onSubmit: (values) => console.log(values),
 *   validate: (values) => ({})
 * });
 */
export const useForm = ({ initialValues = {}, onSubmit = () => {}, validate = () => ({}) }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({ ...prev, [name]: fieldValue }));

    // Validar em tempo real se o campo foi tocado
    if (touched[name]) {
      const newErrors = validate({ ...values, [name]: fieldValue });
      setErrors(newErrors);
    }
  }, [values, touched, validate]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const newErrors = validate(values);
    setErrors(newErrors);
  }, [values, validate]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const newErrors = validate(values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
  };
};

/**
 * useFetch - Requisição HTTP com cache
 */
export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, options]);

  return { data, loading, error };
};

/**
 * useLocalStorage - Persistência em localStorage
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`localStorage error [${key}]:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

/**
 * useDebounce - Debounce de valores
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * usePrevious - Acessa valor anterior
 */
export const usePrevious = (value) => {
  const ref = React.useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};
