'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

module.exports = (db) => {

    app.disable('etag');
    /**
     * @api {get} /health Health check Web Server
     * @apiVersion 1.0.0
     * @apiName HealthCheck
     * @apiGroup Utility
     *
     * @apiSuccess {boolean} healthy Health status of the web server
     *
     * @apiSuccessExample {json} Response:
     *      HTTP/1.1 200 OK
     *      {
     *          healthy:true
     *      }
     */
    app.get('/health', (req, res) => res.status(200).send({
        'healthy': true
    }));

    /**
     * @api {post} /rides Start a New Ride
     * @apiVersion 1.0.0
     * @apiName NewRides
     * @apiGroup Rides
     *
     * @apiParam (Body) {Number{-90 - 90}} start_lat Start latitude of the ride
     * @apiParam (Body) {Number{-180 - 180}} start_long Start longitude of the ride
     * @apiParam (Body) {Number{-90 - 90}} end_lat End latitude of the ride
     * @apiParam (Body) {Number{-180 - 180}} end_long End longitude of the ride
     * @apiParam (Body) {String} rider_name Rider name of the ride
     * @apiParam (Body) {String} driver_name Driver name of the ride
     * @apiParam (Body) {String} driver_vehicle Driver Vehicle of the ride
     *
     * @apiParamExample {json} Request-Example:
     *      {
	 *          "start_lat":0,
	 *          "start_long":0,
	 *          "end_lat":0,
	 *          "end_long":0,
	 *          "rider_name":"Darwin",
	 *          "driver_name":"Driver1",
	 *          "driver_vehicle":"Honda CBR"
     *      }
     *
     *
     * @apiSuccess (Success Response) {Object[]} rides Array of Object Ride
     * @apiSuccess (Success Response) {Number} rides.rideId The Unique ID of the ride
     * @apiSuccess (Success Response) {Number} rides.startLat Start Latitude of the ride
     * @apiSuccess (Success Response) {Number} rides.startLong Start Longitude of the ride
     * @apiSuccess (Success Response) {Number} rides.endLat End Latitude of the ride
     * @apiSuccess (Success Response) {Number} rides.endLong End Longitude of the ride
     * @apiSuccess (Success Response) {String} rides.riderName Rider name of the ride
     * @apiSuccess (Success Response) {String} rides.driverName Driver name of the ride
     * @apiSuccess (Success Response) {String} rides.driverVehicle Driver vehicle of the ride
     * @apiSuccess (Success Response) {Datetime} rides.created Time of the ride was started in format [YYYY-MM-DD HH:mm:ss]
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      [
     *          {
     *              "rideID": 1,
     *              "startLat": 0,
     *              "startLong": 0,
     *              "endLat": 0,
     *              "endLong": 0,
     *              "riderName": "Darwin",
     *              "driverName": "Driver1",
     *              "driverVehicle": "Honda CBR",
     *              "created": "2020-07-19 10:14:16"
     *          }
     *      ]
     *
     *
     * @apiError (Error Code) VALIDATION_ERROR One or many rules of the validation has not been passed
     * @apiError (Error Code) SERVER_ERROR There is something wrong with database server
     *
     * @apiErrorExample Validation-Error-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       error_code: 'VALIDATION_ERROR',
     *       message:'Rider name must be a non empty string'
     *     }
     *
     * @apiErrorExample Server-Error-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       error_code: 'SERVER_ERROR',
     *       message:'Unknown error'
     *     }
     *
     */
    app.post('/rides', jsonParser, (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        if (isNaN(startLongitude) || isNaN(startLatitude) || startLatitude < -90 || startLatitude > 90
            || startLongitude < -180 || startLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 to 90 and -180 to 180 degrees respectively'
            });
        }

        if (isNaN(endLongitude) || isNaN(endLatitude) || endLatitude < -90 || endLatitude > 90
            || endLongitude < -180 || endLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 to 90 and -180 to 180 degrees respectively'
            });
        }

        if (typeof riderName !== 'string' || riderName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverName !== 'string' || driverName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver name must be a non empty string'
            });
        }

        if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver Vehicle must be a non empty string'
            });
        }

        var values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long, req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];

        const result = db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, function (err) {
            if (err) {
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, function (err, rows) {
                if (err) {
                    return res.send({
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    });
                }

                res.send(rows);
            });
        });
    });

    /**
     * @api {get} /rides Fetch All Rides
     * @apiVersion 1.0.0
     * @apiName GetRides
     * @apiGroup Rides
     *
     *
     * @apiSuccess (Success Response) {Object[]} rides Array of Object Ride
     * @apiSuccess (Success Response) {Number} rides.rideId The Unique ID of the ride
     * @apiSuccess (Success Response) {Number} rides.startLat Start Latitude of the ride
     * @apiSuccess (Success Response) {Number} rides.startLong Start Longitude of the ride
     * @apiSuccess (Success Response) {Number} rides.endLat End Latitude of the ride
     * @apiSuccess (Success Response) {Number} rides.endLong End Longitude of the ride
     * @apiSuccess (Success Response) {String} rides.riderName Rider name of the ride
     * @apiSuccess (Success Response) {String} rides.driverName Driver name of the ride
     * @apiSuccess (Success Response) {String} rides.driverVehicle Driver vehicle of the ride
     * @apiSuccess (Success Response) {Datetime} rides.created Time of the ride was started in format [YYYY-MM-DD HH:mm:ss]
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      [
     *          {
     *              "rideID": 1,
     *              "startLat": 0,
     *              "startLong": 0,
     *              "endLat": 0,
     *              "endLong": 0,
     *              "riderName": "Darwin",
     *              "driverName": "Driver1",
     *              "driverVehicle": "Honda CBR",
     *              "created": "2020-07-19 10:14:16"
     *          }
     *      ]
     *
     *
     *
     * @apiError (Error Code) SERVER_ERROR There is something wrong with database server
     * @apiError (Error Code) RIDES_NOT_FOUND_ERROR No rides found in this system
     *
     * @apiErrorExample Server-Error-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       error_code: 'SERVER_ERROR',
     *       message:'Unknown error'
     *     }
     *
     * @apiErrorExample Rides-Not-Found-Error-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       error_code: 'RIDES_NOT_FOUND_ERROR',
     *       message:'Could not find any rides'
     *     }
     *
     */
    app.get('/rides', (req, res) => {
        db.all('SELECT * FROM Rides', function (err, rows) {
            if (err) {
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            res.send(rows);
        });
    });

    /**
     * @api {get} /rides/:id Fetch Ride Detail
     * @apiVersion 1.0.0
     * @apiName GetRideDetail
     * @apiGroup Rides
     *
     * @apiParam {Number} id Rides Unique ID.
     *
     * @apiExample {curl} Example usage:
     * curl -i http://localhost:8010/rides/1
     *
     *
     * @apiSuccess (Success Response) {Object[]} rides Array of Object Ride
     * @apiSuccess (Success Response) {Number} rides.rideId The Unique ID of the ride
     * @apiSuccess (Success Response) {Number} rides.startLat Start Latitude of the ride
     * @apiSuccess (Success Response) {Number} rides.startLong Start Longitude of the ride
     * @apiSuccess (Success Response) {Number} rides.endLat End Latitude of the ride
     * @apiSuccess (Success Response) {Number} rides.endLong End Longitude of the ride
     * @apiSuccess (Success Response) {String} rides.riderName Rider name of the ride
     * @apiSuccess (Success Response) {String} rides.driverName Driver name of the ride
     * @apiSuccess (Success Response) {String} rides.driverVehicle Driver vehicle of the ride
     * @apiSuccess (Success Response) {Datetime} rides.created Time of the ride was started in format [YYYY-MM-DD HH:mm:ss]
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      [
     *          {
     *              "rideID": 1,
     *              "startLat": 0,
     *              "startLong": 0,
     *              "endLat": 0,
     *              "endLong": 0,
     *              "riderName": "Darwin",
     *              "driverName": "Driver1",
     *              "driverVehicle": "Honda CBR",
     *              "created": "2020-07-19 10:14:16"
     *          }
     *      ]
     * @apiError (Error Code) SERVER_ERROR There is something wrong with database server
     * @apiError (Error Code) RIDES_NOT_FOUND_ERROR The <code>id</code> of the rides was not found
     *
     * @apiErrorExample Server-Error-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       error_code: 'SERVER_ERROR',
     *       message:'Unknown error'
     *     }
     *
     * @apiErrorExample Rides-Not-Found-Error-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       error_code: 'RIDES_NOT_FOUND_ERROR',
     *       message:'Could not find any rides'
     *     }
     *
     */
    app.get('/rides/:id', (req, res) => {
        db.all(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`, function (err, rows) {
            if (err) {
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            res.send(rows);
        });
    });

    return app;
};
