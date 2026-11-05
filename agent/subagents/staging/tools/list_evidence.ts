import {boundTool} from '../../../lib/tool.ts';
import {scopedListSchema,readSchema,finalSchema,findingsSchema} from '../../../lib/schemas.ts';
export default boundTool('staging','list_evidence',scopedListSchema('staging'));
