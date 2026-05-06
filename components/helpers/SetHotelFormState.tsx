'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setStayForm } from '@/reduxStore/features/stayFormSlice';

interface SetHotelFormStateProps {
  obj: Record<string, any>;
}

export default function SetHotelFormState({ obj }: SetHotelFormStateProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (Object.keys(obj).length > 0) dispatch(setStayForm(obj));
  }, [JSON.stringify(obj), dispatch]);

  return null;
}