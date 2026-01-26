module.exports = {
  disableEmoji: false,
  format: '{type}{scope}: {emoji}{subject}',
  list: ["add", "fix", "docs", "feat", "refactor", "test", "style", "perf"],

  maxMessageLength: 64,
  minMessageLength: 3,
  questions: ['type', 'subject'],
  scopes: [],
  types: {
    chore: {
      description: 'ビルドプロセスや補助ツールの変更',
      emoji: '🤖',
      value: 'chore'
    },
    add: {
      description: '変更の追加',
      emoji: '❇️',
      value: 'add'
    },
    docs: {
      description: 'ドキュメントのみの変更',
      emoji: '✏️',
      value: 'docs'
    },
    feat: {
      description: '新機能',
      emoji: '🎸',
      value: 'feat'
    },
    fix: {
      description: 'バグ修正',
      emoji: '🐛',
      value: 'fix'
    },
    perf: {
      description: 'パフォーマンス改善',
      emoji: '⚡️',
      value: 'perf'
    },
    refactor: {
      description: 'リファクタリング',
      emoji: '💡',
      value: 'refactor'
    },
    release: {
      description: 'リリースコミットの作成',
      emoji: '🏹',
      value: 'release'
    },
    style: {
      description: 'コードスタイルの修正',
      emoji: '💄',
      value: 'style'
    },
    test: {
      description: 'テストの追加',
      emoji: '💍',
      value: 'test'
    },
    messages: {
      type: 'Select the type of change that you\'re committing:',
      customScope: 'Select the scope this component affects:',
      subject: 'Write a short, imperative mood description of the change:\n',
      body: 'Provide a longer description of the change:\n ',
      breaking: 'List any breaking changes:\n',
      footer: 'Issues this commit closes, e.g #123:',
      confirmCommit: 'The packages that this commit has affected\n',
    },
  }
};
