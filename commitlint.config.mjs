export default {
    parserPreset: 'conventional-changelog-conventionalcommits',
    rules: {
        'body-leading-blank': [ 1, 'always' ],
        'body-max-line-length': [ 2, 'always', 180 ],
        'footer-leading-blank': [ 1, 'always' ],
        'footer-max-line-length': [ 2, 'always', 180 ],
        'header-max-length': [ 2, 'always', 125 ],
        'scope-enum': [ 0, 'always', []],
        'scope-case': [
            2,
            'never',
            [ 'upper-case' ]
        ],
        'subject-case': [
            2,
            'never',
            [ 'pascal-case', 'upper-case' ]
        ],
        'subject-empty': [ 2, 'never' ],
        'subject-full-stop': [ 2, 'never', '.' ],
        'type-case': [ 2, 'always', 'lower-case' ],
        'type-empty': [ 2, 'never' ],
        'type-enum': [
            2,
            'always',
            [
                'build',
                'chore',
                'ci',
                'docs',
                'feat',
                'fix',
                'perf',
                'refactor',
                'revert',
                'style',
                'test',
                'deps'
            ]
        ]
    }
};
