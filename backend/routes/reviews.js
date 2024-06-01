const router = require("express").Router()
const Pin = require("../models/pin")

/**
 * @swagger
 * /api/pins/{pinId}/add_review:
 *   post:
 *     summary: Add a review to a pin
 *     parameters:
 *       - in: path
 *         name: pinId
 *         required: true
 *         schema:
 *           type: string
 *         description: The pin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               text:
 *                 type: string
 *               rating:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Review added successfully
 *       400:
 *         description: User has already reviewed this pin
 *       500:
 *         description: Server error
 */

router.post('/:pinId/add_review', async (req,res) =>{
    try{
        const pin = await Pin.findById(req.params.pinId)
        console.log(pin);
        if (!pin) {
            return res.status(404).json({ message: 'Pin not found' });
        }
        const hasReviewed = pin.reviews.find(review => review.username === req.body.params)
        if(hasReviewed){
            res.status(400).json({message: 'User has already reviewed this pin'})
        }
        else{
        pin.reviews.push(req.body)
        
        await pin.save()
        res.status(200).json(pin);
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
})

/**
 * @swagger
 * /api/pins/{pinId}/delete_review/{reviewId}:
 *   delete:
 *     summary: Delete a review from a pin
 *     parameters:
 *       - in: path
 *         name: pinId
 *         required: true
 *         schema:
 *           type: string
 *         description: The pin ID
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Pin not found
 *       500:
 *         description: Server error
 */

router.delete('/:pinId/delete_review/:reviewId', async (req, res) => {
    const { pinId, reviewId } = req.params;
    try {
      const pin = await Pin.findById(pinId);
      if (!pin) {
        return res.status(404).json({ message: "Pin not found" });
      }
      // Ищем и удаляем отзыв из массива reviews
      pin.reviews = pin.reviews.filter(review => review._id.toString() !== reviewId);
      await pin.save();
      res.status(200).json(pin);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

/**
 * @swagger
 * /api/pins/{pinId}/update_review/{reviewId}:
 *   put:
 *     summary: Update a review of a pin
 *     parameters:
 *       - in: path
 *         name: pinId
 *         required: true
 *         schema:
 *           type: string
 *         description: The pin ID
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: The review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               rating:
 *                 type: integer
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Pin not found
 *       403:
 *         description: Not allowed to edit this review
 *       500:
 *         description: Server error
 */

// PUT маршрут для обновления отзыва
router.put('/:pinId/update_review/:reviewId', async (req, res) => {
    const { pinId, reviewId } = req.params;
    const { text, rating, userId } = req.body;
    try {
      const pin = await Pin.findById(pinId);
      if (!pin) {
        return res.status(404).send('Пин не найден');
      }
      const reviewIndex = pin.reviews.findIndex(review => review._id.toString() === reviewId);  // Находим индекс отзыва для обновления
      if (pin.reviews[reviewIndex].username !== userId) {// что отзыв принадлежит пользователю
        return res.status(403).send('Нет прав для редактирования этого отзыва');
      }
      // Обновляем отзыв
      pin.reviews[reviewIndex].text = text;
      pin.reviews[reviewIndex].rating = rating;
      await pin.save();
      res.status(200).json(pin);
    } catch (error) {
      console.error("ERROR", error);
      res.status(500).send('Ошибка на сервере: ' + error.message);
    }
  });

module.exports = router