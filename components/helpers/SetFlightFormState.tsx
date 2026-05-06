'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setFlightForm } from '@/reduxStore/features/flightFormSlice';

interface SetFlightFormStateProps {
  obj: Record<string, any>;
}

export default function SetFlightFormState({ obj }: SetFlightFormStateProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (Object.keys(obj).length > 0) dispatch(setFlightForm(obj));
  }, [JSON.stringify(obj), dispatch]);

  return null;
}