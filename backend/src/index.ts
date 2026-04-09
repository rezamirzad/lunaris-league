import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/hello', (req, res) => {
  const { name } = req.body;
  if (name) {
    res.json({ message: `Hello ${name}` });
  } else {
    res.status(400).json({ error: 'Name is required' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
