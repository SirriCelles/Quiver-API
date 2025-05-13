import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchError.js';

export const getAllResource = (Model) =>
  catchAsync(async (req, res, next) => {
    const query = Model.find();
    const features = new APIFeatures(query, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        docs,
      },
    });
  });

export const getResource = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let resourceQuery = Model.findById(req.params.id);

    if (populateOptions) {
      resourceQuery = await resourceQuery.populate(populateOptions);
    }

    const doc = await resourceQuery;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

export const deleteResource = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
