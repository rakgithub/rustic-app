// Exposed by the federation plugin as 'commerce/App'.
// Consumers render it lazily via `lazyProvider('commerce', 'App')`.
export function App() {
  return (
    <section data-testid="commerce">
      <h1>Hello from commerce</h1>
    </section>
  );
}

export default App;
