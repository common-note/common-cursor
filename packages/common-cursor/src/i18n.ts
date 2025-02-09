export type MessageType = {
  QUERY_ERROR: {
    NOT_TEXT_NODE: string;
    PARENT_IS_NULL_OR_ROOT: string;
    AT_TEXT_NODE_BOUNDARY: string;
    INVALID_NEIGHBOR_DIRECTION: string;
    INVALID_LOGIC: string;
    CANNOT_GET_ANCHOR: string;
    CANNOT_GET_OFFSET: string;
    INVALID_ANCHOR_NODE: string;
    NOT_TEXT_NODE_OR_HTML_ELEMENT: string;
  };
};
// Add message constants at the top of the file
export const MESSAGES_EN: MessageType = {
  QUERY_ERROR: {
    NOT_TEXT_NODE: 'Anchor is not a text node.',
    PARENT_IS_NULL_OR_ROOT: 'Parent is null or root.',
    AT_TEXT_NODE_BOUNDARY: 'At text node boundary.',
    INVALID_NEIGHBOR_DIRECTION: 'Invalid neighbor direction.',
    INVALID_LOGIC: 'invalid search.',
    CANNOT_GET_ANCHOR: 'Can not get anchor by offset.',
    CANNOT_GET_OFFSET: 'Can not get offset of this anchor.',
    INVALID_ANCHOR_NODE: 'Invalid anchor node type.',
    NOT_TEXT_NODE_OR_HTML_ELEMENT: 'Anchor is not a text node or html element',
  },
};

export const I18N: { [key: string]: MessageType } = {
  en: MESSAGES_EN,
  // zh: MESSAGES_ZH
};
