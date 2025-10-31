class ApiResponse {
  /**
   * Create a standardized API response
   * @param {Object} res - Express response object
   * @param {Object} options - Response options
   */

  constructor(res, options = {}) {
    this.res = res;
    this.options = {
      statusCode: 200,
      message: 'Success',
      data: null,
      meta: null,
      ...options
    };
  }

    // 201 Created response
  created(message, data = null) {
    return this.send(message, data, 201);
  }

  // 204 No Content
  noContent() {
    return this.res.status(204).end();
  }


  /**
   * Send the response
   */
  send() {
    const { statusCode, message, data, meta } = this.options;
    const response = {
      success: true,
      message,
      data,
      ...(meta && { meta }),
      timestamp: new Date().toISOString()
    };

    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${statusCode} ${message}`);
    }

    return this.res.status(statusCode).json(response);
  }

  /**
   * Send a paginated response
   * @param {Array} items - Array of items
   * @param {number} total - Total number of items
   * @param {Object} pagination - Pagination options
   */
  paginate(items, total, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const totalPages = Math.ceil(total / limit);

    this.options.data = items;
    this.options.meta = {
      pagination: {
        total,
        totalPages,
        currentPage: page,
        perPage: limit,
        ...(page > 1 && { previous: page - 1 }),
        ...(page < totalPages && { next: page + 1 })
      }
    };

    return this.send();
  }

  /**
   * Set response message
   * @param {string} message - Response message
   */
  setMessage(message) {
    this.options.message = message;
    return this;
  }

  /**
   * Set response data
   * @param {Object} data - Response data
   */
  setData(data) {
    this.options.data = data;
    return this;
  }

  /**
   * Set response metadata
   * @param {Object} meta - Metadata
   */
  setMeta(meta) {
    this.options.meta = meta;
    return this;
  }

  /**
   * Set HTTP status code
   * @param {number} statusCode - HTTP status code
   */
  setStatusCode(statusCode) {
    this.options.statusCode = statusCode;
    return this;
  }
}

// Common response helpers
const successResponse = (res, message, data = null, statusCode = 200) => {
  return new ApiResponse(res, { statusCode, message, data }).send();
};

const createdResponse = (res, message, data = null) => {
  return new ApiResponse(res, { statusCode: 201, message, data }).send();
};

const noContentResponse = (res, message = 'No content') => {
  return new ApiResponse(res, { statusCode: 204, message }).send();
};

const paginatedResponse = (res, message, items, total, pagination = {}) => {
  return new ApiResponse(res, { message })
    .paginate(items, total, pagination);
};

module.exports = {
  ApiResponse,
  successResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse
};