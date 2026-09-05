// Exposed by the federation plugin as 'account/App'.
// Consumers render it lazily via `lazyProvider('account', 'App')`.
export function App() {
  return (
    <section data-testid="account">
      <h1>Hello, Welcome to Rustic</h1>
    </section>
  );
}

export default App;
