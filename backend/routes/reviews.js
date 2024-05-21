const router = require("express").Router()
const Pin = require("../models/pin")

router.post('/:pinId/add_review', async (req,res) =>{
    
})

// router.delete('/:pinId/delete_review/:reviewId', async (req, res) => {
//     const { pinId, reviewId } = req.params;
  
//     try {
//       const pin = await Pin.findById(pinId);
//       if (!pin) {
//         return res.status(404).send('Пин не найден');
//       }
  
//       // Если отзыв один и принадлежит пользователю, который создал пин, то удаляем весь пин
//       if (pin.reviews.length === 1 && pin.reviews[0]._id.toString() === reviewId) {
//         await Pin.findByIdAndRemove(pinId);
//         return res.status(200).send('Пин и отзыв удалены');
//       }
  
//       // Если пользователь удаляет свой отзыв, и это не создатель пина
//       pin.reviews = pin.reviews.filter(review => review._id.toString() !== reviewId);
  
//       // Если был удален отзыв создателя пина, обновляем описание пина
//       if (pin.username === req.body.username && pin.desc === req.body.reviewText) {
//         if (pin.reviews.length > 0) {
//           // Обновляем desc первым отзывом из оставшихся
//           pin.desc = pin.reviews[0].text;
//         } else {
//           // Если других отзывов не осталось, очищаем desc
//           pin.desc = '';
//         }
//       }
  
//       await pin.save();
//       res.status(200).send('Отзыв удален');
//     } catch (error) {
//       console.error("ERROR", error);
//       res.status(500).send('Ошибка на сервере: ' + error.message);
//     }
//   });

router.delete('/:pinId/delete_review/:reviewId', async (req, res) => {

  });



// PUT маршрут для обновления отзыва
router.put('/:pinId/update_review/:reviewId', async (req, res) => {

  });

module.exports = router