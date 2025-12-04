import app  from "./app";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});