import { mergeTests } from '@playwright/test';
import { test as navigationTest } from './navigation.js';
import { test as toastTest } from './toast.js';

export const test = mergeTests(navigationTest, toastTest);
