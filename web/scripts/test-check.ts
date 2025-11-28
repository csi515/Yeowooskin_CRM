import { something } from '@/lib/utils'; // Should be fine if utils exists
import { wrong } from '@/Lib/utils'; // Case error
import { missing } from '@/lib/nonexistent'; // Missing error
