import {boundTool} from '../../../lib/tool.ts';
import {scopedListSchema,readSchema,finalSchema,findingsSchema} from '../../../lib/schemas.ts';
export default boundTool('tests','list_evidence',scopedListSchema('tests'));
