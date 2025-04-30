import { Router } from "express";

const router = Router()

router.get("/", (req, res) => {
  res.send(`
    <h3>Server online</h3>
    <pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

export default router