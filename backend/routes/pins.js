const router = require("express").Router()
const pin = require("../models/pin")

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - username
 *         - text
 *         - rating
 *       properties:
 *         username:
 *           type: string
 *         text:
 *           type: string
 *         rating:
 *           type: integer
 *           format: int32
 *           minimum: 0
 *           maximum: 5
 *       example:
 *         username: john_doe
 *         text: This place is amazing!
 *         rating: 5
 * 
 *     Pin:
 *       type: object
 *       required:
 *         - username
 *         - title
 *         - desc
 *         - rating
 *         - countryName
 *         - lat
 *         - long
 *       properties:
 *         username:
 *           type: string
 *         title:
 *           type: string
 *         desc:
 *           type: string
 *         rating:
 *           type: integer
 *           format: int32
 *         countryName:
 *           type: string
 *         lat:
 *           type: number
 *           format: float
 *         long:
 *           type: number
 *           format: float
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *       example:
 *         username: john_doe
 *         title: Great Place
 *         desc: This is a wonderful place to visit.
 *         rating: 5
 *         countryName: USA
 *         lat: 47.040182
 *         long: 17.071727
 *         reviews:
 *           - username: jane_doe
 *             text: I agree, this place is fantastic!
 *             rating: 5
 */

/**
 * @swagger
 * /api/pins:
 *   get:
 *     summary: Retrieve a list of pins
 *     responses:
 *       200:
 *         description: A list of pins
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pin'
 */

//получить все пины
router.get("/", async (req,res) => {
  try{
      const pins = await pin.find()
      res.status(200).json(pins)
  }
  catch(err){
      res.status(500).json(err)
  }
})

/**
 * @swagger
 * /api/pins:
 *   post:
 *     summary: Create a new pin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pin'
 *     responses:
 *       201:
 *         description: Pin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pin'
 *       500:
 *         description: Internal server error
 */

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

/**
 * @swagger
 * /api/pins/{pinId}/update:
 *   put:
 *     summary: Update a pin
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
 *               desc:
 *                 type: string
 *               rating:
 *                 type: integer
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pin'
 *       404:
 *         description: Pin not found
 *       403:
 *         description: Not allowed to edit this pin
 *       500:
 *         description: Server error
 */

// Обновление описания и рейтинга пина создателем
router.put('/:pinId/update', async (req, res) => {
    const { pinId } = req.params;
    const { desc, rating, userId } = req.body; // Получаем описание рейтинг и ID пользователя из тела запроса
    try {
      const foundPin = await pin.findById(pinId);
      if (!foundPin) {
        return res.status(404).send('Pin not found');
      }
      console.log("USERNAME",foundPin.username);
      console.log('UserID from request body:', req.body.userId);
      // Проверяем что ID пользователя совпадает с создателем пина
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

/**
 * @swagger
 * /api/pins/{pinId}:
 *   delete:
 *     summary: Delete a pin
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
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pin deleted successfully
 *       403:
 *         description: Not allowed to delete this pin
 *       500:
 *         description: Server error
 */

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


/**
 * @swagger
 * /api/pins/{pinId}/delete_desc:
 *   delete:
 *     summary: Delete the description of a pin
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
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Description deleted and replaced successfully
 *       404:
 *         description: Pin not found
 *       403:
 *         description: Not allowed to delete this description
 *       500:
 *         description: Server error
 */

  ///owner delete desc and awap with reviews
  //удаление первоначального отзыва создателя пина
  router.delete('/:pinId/delete_desc', async (req, res) => {
    const { pinId } = req.params;
    const { userId } = req.body; // userId отправляется в теле запроса
    try {
        const foundPin = await pin.findById(pinId);
        console.log(foundPin);
        if (!foundPin) {
            return res.status(404).send('Пин не найден');
          }
        if (foundPin.username !== userId) { // текущий пользователь является создателем пина
            return res.status(403).send('Недостаточно прав для выполнения операции');
        }
        if (foundPin.reviews && foundPin.reviews.length > 0) {
            const firstReview = foundPin.reviews[0]; // Получаем первый отзыв из массива
            foundPin.desc = firstReview.text; 
            foundPin.rating = firstReview.rating; 
            foundPin.username = firstReview.username; 
            foundPin.reviews.shift(); // Удаляем первый отзыв из массива
          } else {
            // Если отзывов не осталось очищаем описание и рейтинг
            foundPin.desc = '';
            foundPin.rating = 1; // или устанавливаем рейтинг по умолчанию
          }
          await foundPin.save();
          res.status(200).json(foundPin);
        } 
        catch (error) {
          console.error("Ошибка на сервере:", error);
          res.status(500).send('Ошибка на сервере: ' + error.message);
        }
});

module.exports = router