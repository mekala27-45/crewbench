import {boundTool} from '../../../lib/tool.ts';
import {scopedListSchema,readSchema,finalSchema,findingsSchema} from '../../../lib/schemas.ts';
export default boundTool('solo','list_evidence',scopedListSchema('solo'));
