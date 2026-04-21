# Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## Development

1. Clone the repo and install dependencies:

```sh
git clone https://github.com/luciaLebrun/react-native-crossword.git
cd react-native-crossword
yarn install
```

2. Run the type checker in watch mode:

```sh
yarn typecheck
```

3. Run tests:

```sh
yarn test
```

4. To test in the example app:

```sh
cd example
yarn install
yarn ios   # or yarn android
```

## Code style

- TypeScript strict mode
- ESLint for linting
- Prettier for formatting

Run `yarn lint` before submitting a PR.

## Pull requests

- Keep PRs focused on a single change
- Add tests for new features
- Update the README if the public API changes
