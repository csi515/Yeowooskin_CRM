import { getEnv } from '@/app/lib/env';
import { cn } from '@/app/lib/utils/cn';

// This file is used to verify TypeScript configuration in the scripts directory.
console.log('Environment check:', getEnv.supabaseUrl() ? 'OK' : 'Missing');
console.log('Utils check:', cn('test', 'class'));
