const router = require("express").Router()
const Pin = require("../models/pin")

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
// PUT маршрут для обновления отзыва
router.put('/:pinId/update_review/:reviewId', async (req, res) => {
    const { pinId, reviewId } = req.params;
    const { text, rating, userId } = req.body;
    try {
      const pin = await Pin.findById(pinId);
      if (!pin) {
        return res.status(404).send('Пин не найден');
      }
      // Находим индекс отзыва для обновления
      const reviewIndex = pin.reviews.findIndex(review => review._id.toString() === reviewId);
      // Проверяем, что отзыв принадлежит пользователю
      if (pin.reviews[reviewIndex].username !== userId) {
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