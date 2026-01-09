const ProfitDal = require("../dal/profit");
const mongoose = require("mongoose");
exports.validateProfit = (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }
  ProfitDal.get(
    {
      _id: id,
    },
    function (err, doc) {
      if (err) {
        return next(err);
      }
      if (doc._id) {
        req.doc = doc;
        next();
      } else {
        res.status(404).json({
          error: true,
          status: 404,
          msg: "Profit _id " + id + " not found",
        });
      }
    }
  );
};
exports.fetchAll = (req, res, next) => {
  let query = {currency_type: req.params.currency};
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {created_at: -1},
  };
  try {
    ProfitDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs.docs,
        limit: limit,
        skip: page,
        total: doc.docs.total,
        profit: {
          USD: getTotalAmountinUsd(doc.docs),
          ETB: getTotalAmountinETB(doc.docs),
        },
      });
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.fetchOne = (req, res, next) => {
  res.json(req.doc);
};

// Function to calculate total amount
function getTotalAmountinUsd(data) {
  let total = 0;
  for (const item of data.docs) {
    if (item.currency_type === "USD") {
      total += item.amount;
    }
  }
  return total;
}
function getTotalAmountinETB(data) {
  let total = 0;
  for (const item of data.docs) {
    if (item.currency_type === "ETB") {
      total += item.amount;
    }
  }
  return total;
}
