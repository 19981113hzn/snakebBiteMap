const division = require('china-division')
const chinaProvinces = require('../../src/assets/data/chinaProvince')
const randomLocation = require('random-location');

const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./localStorage');

module.exports = {
    url: /\/hospitals$/,
    method: 'get',
    result: function(req, res) {
        const Mock = res.Mock

        var mockParam = {
            "status": "OK",
            "message": "操作成功"
        }

        let responseData = []

        responseData = JSON.parse(localStorage.getItem('data'))

        // 获取已模拟的随机数据
        if (responseData && responseData.length !== 0) {
            // 随机实时更新 +/-
            const randomOffset = Math.floor(Math.random() * 5) + 1

            const randomSign = Math.random() < 0.5 ? -1 : 1

            const offset = randomOffset * randomSign

            const hospitalType = randomSign === 1 ? 1 : 2

            const newHospitalData = {
                "type": hospitalType,
                "isNew": true,
                "adress": getRandomData(),
                "doctor_num": function() {
                    const numDoctors = Math.floor(Math.random() * 2000) + 1
                    return numDoctors
                }(),
                "snakebite_num": function() {
                    const numSnakebite = Math.floor(Math.random() * 9831) + 200
                    return numSnakebite
                }(),
                "antivenom_num": function() {
                    const numAntivenom = Math.floor(Math.random() * 9821) + 180;
                    return numAntivenom
                }(),
            }

            // 随机新增医生和血清数量
            responseData[0].snakebite_num += offset
            responseData[0].doctor_num += offset

            // const isAddHospital = Math.floor(Math.random() * 10)
            const isAddHospital = 1

            if (isAddHospital <= 1) {
                for (let i = 0; i <= isAddHospital; i++) {
                    let address = {}
                    address = getRandomData()

                    newHospitalData["adress"] = address

                    responseData.push(newHospitalData)
                }
            }

            mockParam = {
                ...mockParam,
                data: {
                    "result": responseData
                }
            }

            localStorage.setItem('data', JSON.stringify(responseData))

            return res.send(Mock.mock(mockParam))
        }

        function getRandomData() {
            const chinaBounds = {
                north: 53.55, // 中国最北端纬度
                south: 3.86, // 中国最南端纬度
                west: 73.66, // 中国最西端经度
                east: 135.05 // 中国最东端经度
            }

            // 定义圆心和半径
            const centerData = {
                latitude: 35.8617,
                longitude: 104.1954
            }
            const radius = 1000000

            let point = randomLocation.randomCirclePoint(centerData, radius)

            while (point.latitude > chinaBounds.north || point.latitude < chinaBounds.south || point.longitude < chinaBounds.west || point.longitude > chinaBounds.east) {
                point = randomLocation.randomCirclePoint(center, radius)
            }

            const province = division.pcasC[Math.floor(Math.random() * division.pcasC.length)],
                city = province.children[Math.floor(Math.random() * province.children.length)]

            const center = chinaProvinces[province.name]
            const center1 = {
                latitude: center[1],
                longitude: center[0]
            }

            let radius1 = 400000

            let point1 = randomLocation.randomCirclePoint(center1, radius1)

            const district = city.children[Math.floor(Math.random() * city.children.length)],
                street = district.children[Math.floor(Math.random() * district.children.length)],
                address = `${province.name}${city.name}${district.name}${street.name}${Math.floor(Math.random() * 100) + 1}号${Math.floor(Math.random() * 10) + 1}单元${Math.floor(Math.random() * 10) + 1}层${Math.floor(Math.random() * 10) + 1}室救治点`

            const prefixes = street.name ? city.name + street.name : city.name + district.name,
                suffixes = ['医院', '诊所', '医疗室', '医疗所', '卫生院', '社区卫生服务中心'],
                suffix = suffixes[Math.floor(Math.random() * suffixes.length)]

            return {
                location: [point1.longitude, point1.latitude],
                address: address,
                name: `${prefixes + suffix}`,
                createTime: new Date().getTime()
            }
        }

        let data_body = [{
            "type|1": [1, 2], //类型 1-城区 2-基层
            "adress": () => {
                return getRandomData()
            },
            "doctor_num": function() {
                const numDoctors = Math.floor(Math.random() * 2000) + 1
                return numDoctors
            },
            "snakebite_num": function() {
                const numSnakebite = Math.floor(Math.random() * 9831) + 200
                return numSnakebite
            },
            "antivenom_num": function() {
                const numAntivenom = Math.floor(Math.random() * 9821) + 180;
                return numAntivenom
            },
        }]

        mockParam = {
            ...mockParam,
            data: {
                "result|10": data_body
            }
        }

        const data = Mock.mock(mockParam)

        // 存储一次数据 后续小范围更新
        responseData = data.data.result
        localStorage.setItem('data', JSON.stringify(responseData))
        res.send(data)
    }
}