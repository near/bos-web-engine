export type DebugLogParams = {
  source: 'RPC View' | 'RPC Signed Transaction';
  identifier?: string;
  messages: DebugLogMessage[];
};

export type DebugLogMessage = {
  data: any;
  description?: string;
  type: 'ERROR' | 'INFO' | 'REQUEST' | 'RESPONSE';
};

const sourceIcons: Record<DebugLogParams['source'], string> = {
  'RPC View': '📖',
  'RPC Signed Transaction': '📝',
};

const messageTypeIcons: Record<DebugLogMessage['type'], string> = {
  ERROR: '❌',
  INFO: '💡',
  REQUEST: '💬',
  RESPONSE: '✅',
};

export function debugLog({ source, identifier, messages }: DebugLogParams) {
  const date = new Date();

  console.groupCollapsed(
    `${sourceIcons[source]} ${source} @ ${date.toLocaleString()} ${
      identifier ? `| ${identifier} ` : ''
    }`
  );

  messages.forEach((message) => {
    console.log(
      ...[
        `${messageTypeIcons[message.type]} ${message.type}`,
        message.description,
        message.data,
      ].filter((messageChunk) => messageChunk)
    );
  });

  console.groupEnd();
}
