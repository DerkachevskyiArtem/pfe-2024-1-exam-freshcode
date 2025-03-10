const bd = require('../models');
const RightsError = require('../errors/RightsError');
const ServerError = require('../errors/ServerError');
const CONSTANTS = require('../constants');

module.exports.parseBody = (req, res, next) => {
  try {
    req.body.contests = JSON.parse(req.body.contests);
    req.body.contests.forEach((contest, index) => {
      if (contest.haveFile) {
        const file = req.files.splice(0, 1);
        contest.fileName = file[0].filename;
        contest.originalFileName = file[0].originalname;
      }
    });
    next();
  } catch (e) {
    next(new ServerError('Invalid JSON format in contests body'));
  }
};

module.exports.canGetContest = async (req, res, next) => {
  try {
    const { contestId } = req.params;
    let result = null;

    if (req.tokenData.role === CONSTANTS.CUSTOMER) {
      result = await bd.Contests.findOne({
        where: { id: contestId, userId: req.tokenData.userId },
      });
    } else if (req.tokenData.role === CONSTANTS.CREATOR) {
      result = await bd.Contests.findOne({
        where: {
          id: contestId,
          status: {
            [bd.Sequelize.Op.or]: [
              CONSTANTS.CONTEST_STATUS_ACTIVE,
              CONSTANTS.CONTEST_STATUS_FINISHED,
            ],
          },
        },
      });
    }
    result ? next() : next(new RightsError());
  } catch (e) {
    next(new ServerError(e));
  }
};

module.exports.onlyForCreative = (req, res, next) => {
  if (req.tokenData.role === CONSTANTS.CUSTOMER) {
    return next(new RightsError());
  }
  next();
};

module.exports.onlyForCustomer = (req, res, next) => {
  if (req.tokenData.role === CONSTANTS.CREATOR) {
    return next(new RightsError('This page is only for customers'));
  }
  next();
};

module.exports.canSendOffer = async (req, res, next) => {
  if (req.tokenData.role === CONSTANTS.CUSTOMER) {
    return next(new RightsError());
  }
  try {
    const contest = await bd.Contests.findOne({
      where: { id: req.params.contestId },
      attributes: ['status'],
    });

    if (contest && contest.status === CONSTANTS.CONTEST_STATUS_ACTIVE) {
      return next();
    }
    next(new RightsError());
  } catch (e) {
    next(new ServerError(e));
  }
};

module.exports.onlyForCustomerWhoCreateContest = async (req, res, next) => {
  try {
    const contest = await bd.Contests.findOne({
      where: {
        userId: req.tokenData.userId,
        id: req.params.contestId,
        status: CONSTANTS.CONTEST_STATUS_ACTIVE,
      },
    });

    if (!contest) {
      return next(new RightsError());
    }
    next();
  } catch (e) {
    next(new ServerError(e));
  }
};

module.exports.canUpdateContest = async (req, res, next) => {
  try {
    const contest = await bd.Contests.findOne({
      where: {
        userId: req.tokenData.userId,
        id: req.params.contestId,
        status: { [bd.Sequelize.Op.not]: CONSTANTS.CONTEST_STATUS_FINISHED },
      },
    });

    if (!contest) {
      return next(new RightsError());
    }
    next();
  } catch (e) {
    next(new ServerError(e));
  }
};
