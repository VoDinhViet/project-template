import { MAX_SEARCH_KEYWORD_LENGTH } from '../../../constants/app.constant.js';
import { StringFieldOptional } from '../../../decorators/field.decorators.js';

export class GetInvitationSuggestionsReqDto {
  @StringFieldOptional({
    maxLength: MAX_SEARCH_KEYWORD_LENGTH,
    description: 'Từ khoá tìm trong email',
  })
  readonly q?: string;
}
