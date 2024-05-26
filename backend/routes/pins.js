const router = require("express").Router()
const pin = require("../models/pin")

//create a pin

// Обновление описания и рейтинга пина создателем
router.put('/:pinId/update', async (req, res) => {
    const { pinId } = req.params;
    const { desc, rating, userId } = req.body; // Получаем описание, рейтинг и ID пользователя из тела запроса
    
    try {
      const foundPin = await pin.findById(pinId);
      if (!foundPin) {
        return res.status(404).send('Pin not found');
      }
      console.log("USERNAME",foundPin.username);
      console.log('UserID from request body:', req.body.userId);

      // Проверяем, что ID пользователя совпадает с создателем пина
      if (!foundPin.username || foundPin.username.toString() !== userId) {
        return res.status(403).send('Not allowed to edit this pin');
      }
  
      // Обновляем описание и рейтинг пина
      foundPin.desc = desc;
      foundPin.rating = rating;
  
      await foundPin.save(); // Сохраняем обновленный пин
      res.status(200).json(foundPin);
    } catch (error) {
      console.error('Error updating the pin:', error);
      res.status(500).send('Server error: ' + error.message);
    }
  });

router.post("/", async (req,res)=> {
    const newPin = new pin(req.body)

    try{
        const savedPin = await newPin.save()
        res.status(200).json(savedPin)
    }
    catch(err){
        res.status(500).json(err)
    }
})
//get all pins

router.get("/", async (req,res) => {
    try{
        const pins = await pin.find()
        res.status(200).json(pins)
    }
    catch(err){
        res.status(500).json(err)
    }
})

router.delete('/:pinId', async (req, res) => {
    try {
      const foundPin = await pin.findById(req.params.pinId);
      if (foundPin.username === req.body.userId && foundPin.reviews.length === 0) {
        await pin.findByIdAndDelete(req.params.pinId);
        res.status(200).send('Пин и отзыв успешно удалены');
      } else {
        res.status(403).send('Недостаточно прав для выполнения операции');
      }
    } catch (error) {
      console.error("Ошибка на сервере:", error);
      res.status(500).send('Ошибка на сервере: ' + error.message);
    }
  });

  ///owner delete desc and awap with reviews

  // Сервер: удаление первоначального отзыва создателя пина
  router.delete('/:pinId/delete_desc', async (req, res) => {
    const { pinId } = req.params;
    const { userId } = req.body; // Предполагаем, что userId отправляется в теле запроса

    try {
        const foundPin = await pin.findById(pinId);
        console.log(foundPin);
        if (!foundPin) {
            return res.status(404).send('Пин не найден');
          }
        // Проверяем, что текущий пользователь является создателем пина
        if (foundPin.username !== userId) {
            return res.status(403).send('Недостаточно прав для выполнения операции');
        }

        if (foundPin.reviews && foundPin.reviews.length > 0) {
            const firstReview = foundPin.reviews[0]; // Получаем первый отзыв из массива
            foundPin.desc = firstReview.text; // Обновляем описание
            foundPin.rating = firstReview.rating; // Обновляем рейтинг
            foundPin.username = firstReview.username; // Обновляем имя пользователя
            foundPin.reviews.shift(); // Удаляем первый отзыв из массива
          } else {
            // Если отзывов не осталось, очищаем описание и рейтинг
            foundPin.desc = '';
            foundPin.rating = 0; // или устанавливаем рейтинг по умолчанию
            // Имя пользователя можно не менять, так как это имя создателя пина
          }
      
          await foundPin.save();
          res.status(200).json(foundPin);
        } catch (error) {
          console.error("Ошибка на сервере:", error);
          res.status(500).send('Ошибка на сервере: ' + error.message);
        }
});

module.exports = router