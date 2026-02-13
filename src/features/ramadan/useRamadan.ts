"use client";

import { useContext } from 'react';
import { RamadanContext } from './RamadanProvider';

export const useRamadan = () => {
  return useContext(RamadanContext);
};
