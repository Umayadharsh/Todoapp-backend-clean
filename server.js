require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI; // Use MONGO_URI consistently

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ DB connected"))
.catch((err) => console.log("❌ DB connection failed", err));


// Schema & Model
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  recurring: { type: String, enum: ["None", "Daily", "Weekly", "Monthly"], default: "None" },
  status: { type: Boolean, default: false }
}, { timestamps: true }); // adds createdAt, updatedAt

const todoModel = mongoose.model('Todo', todoSchema);

// POST: create a todo
app.post('/todos', async (req, res) => {
  const { title, description, dueDate, priority, recurring } = req.body;
  try {
    const newTodo = new todoModel({ title, description, dueDate, priority, recurring });
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: fetch all todos
app.get('/todos', async (req, res) => {
  try {
    // Sort by dueDate ascending (earliest first)
    const todos = await todoModel.find().sort({ dueDate: 1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT: update title/description/dueDate/etc
app.put('/todos/:id', async (req, res) => {
  const id = req.params.id;
  const { title, description, dueDate, priority, recurring, status } = req.body;

  try {
    const updatedTodo = await todoModel.findByIdAndUpdate(
      id,
      { title, description, dueDate, priority, recurring, status },
      { new: true }
    );

    if (!updatedTodo) return res.status(404).json({ message: "Todo not found" });
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH: update fields dynamically
app.patch('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedTodo = await todoModel.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedTodo) return res.status(404).json({ message: "Todo not found" });
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE: delete a todo
app.delete('/todos/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const deletedTodo = await todoModel.findByIdAndDelete(id);
    if (!deletedTodo) return res.status(404).json({ message: "Todo not found" });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Todo backend is running 🚀");
});
