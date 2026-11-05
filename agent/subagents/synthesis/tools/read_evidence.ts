import {boundTool} from '../../../lib/tool.ts';
import {scopedListSchema,readSchema,finalSchema,findingsSchema} from '../../../lib/schemas.ts';
export default boundTool('synthesis','read_evidence',readSchema);
