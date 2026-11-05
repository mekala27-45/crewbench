import {boundTool} from '../../../lib/tool.ts';
import {listSchema,readSchema,finalSchema,findingsSchema} from '../../../lib/schemas.ts';
export default boundTool('synthesis','submit_assessment',finalSchema);
