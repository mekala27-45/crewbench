import {boundTool} from '../../../lib/tool.ts';
import {listSchema,readSchema,finalSchema,findingsSchema} from '../../../lib/schemas.ts';
export default boundTool('staging','submit_findings',findingsSchema('staging'));
