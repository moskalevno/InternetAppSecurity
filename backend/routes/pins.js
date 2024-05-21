const router = require("express").Router()
const pin = require("../models/pin")

//create a pin

// Обновление описания и рейтинга пина создателем
router.put('/:pinId/update', async (req, res) => {

  });

router.post("/", async (req,res)=> {

})
//get all pins

router.get("/", async (req,res) => {

})

router.delete('/:pinId', async (req, res) => {

  });

  ///owner delete desc and awap with reviews

  // Сервер: удаление первоначального отзыва создателя пина
  router.delete('/:pinId/delete_desc', async (req, res) => {

});

module.exports = router