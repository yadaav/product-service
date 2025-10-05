"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const productsPath = path_1.default.join(__dirname, '..', 'getProductsList', 'products.json');
let products = [];
// Lazy load products once
try {
    const raw = fs_1.default.readFileSync(productsPath, 'utf8');
    products = JSON.parse(raw);
}
catch (err) {
    console.error('Failed to load products.json', err);
    products = [];
}
const handler = async (event) => {
    const productId = event.pathParameters?.productId ?? null;
    if (!productId) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Missing productId in path' })
        };
    }
    const product = products.find((p) => p.id === productId);
    if (!product) {
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Product not found' })
        };
    }
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(product)
    };
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBRXhCLE1BQU0sWUFBWSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztBQVdwRixJQUFJLFFBQVEsR0FBYyxFQUFFLENBQUM7QUFFN0IsMEJBQTBCO0FBQzFCLElBQUksQ0FBQztJQUNILE1BQU0sR0FBRyxHQUFHLFlBQUUsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xELFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBYyxDQUFDO0FBQzFDLENBQUM7QUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuRCxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLENBQUM7QUFTTSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBc0IsRUFBRSxFQUFFO0lBQ3RELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsU0FBUyxJQUFJLElBQUksQ0FBQztJQUUxRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDZixPQUFPO1lBQ0wsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUU7Z0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNuQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLDJCQUEyQixFQUFFLENBQUM7U0FDL0QsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFDO0lBRXpELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNiLE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyw2QkFBNkIsRUFBRSxHQUFHO2FBQ25DO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQztTQUN2RCxDQUFDO0lBQ0osQ0FBQztJQUVELE9BQU87UUFDTCxVQUFVLEVBQUUsR0FBRztRQUNmLE9BQU8sRUFBRTtZQUNQLGNBQWMsRUFBRSxrQkFBa0I7WUFDbEMsNkJBQTZCLEVBQUUsR0FBRztTQUNuQztRQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztLQUM5QixDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBbkNXLFFBQUEsT0FBTyxXQW1DbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmNvbnN0IHByb2R1Y3RzUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdnZXRQcm9kdWN0c0xpc3QnLCAncHJvZHVjdHMuanNvbicpO1xuXG5leHBvcnQgdHlwZSBQcm9kdWN0ID0ge1xuICBpZDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBwcmljZTogbnVtYmVyO1xuICBjdXJyZW5jeTogc3RyaW5nO1xuICBpbWFnZTogc3RyaW5nO1xuICBjYXRlZ29yeTogc3RyaW5nO1xufTtcblxubGV0IHByb2R1Y3RzOiBQcm9kdWN0W10gPSBbXTtcblxuLy8gTGF6eSBsb2FkIHByb2R1Y3RzIG9uY2VcbnRyeSB7XG4gIGNvbnN0IHJhdyA9IGZzLnJlYWRGaWxlU3luYyhwcm9kdWN0c1BhdGgsICd1dGY4Jyk7XG4gIHByb2R1Y3RzID0gSlNPTi5wYXJzZShyYXcpIGFzIFByb2R1Y3RbXTtcbn0gY2F0Y2ggKGVycikge1xuICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBwcm9kdWN0cy5qc29uJywgZXJyKTtcbiAgcHJvZHVjdHMgPSBbXTtcbn1cblxuLy8gRGVmaW5lIEFQSSBHYXRld2F5IGV2ZW50IHR5cGUgKGJhc2ljKVxuaW50ZXJmYWNlIEFQSUdhdGV3YXlFdmVudCB7XG4gIHBhdGhQYXJhbWV0ZXJzPzoge1xuICAgIHByb2R1Y3RJZD86IHN0cmluZztcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlFdmVudCkgPT4ge1xuICBjb25zdCBwcm9kdWN0SWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8ucHJvZHVjdElkID8/IG51bGw7XG5cbiAgaWYgKCFwcm9kdWN0SWQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzQ29kZTogNDAwLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnTWlzc2luZyBwcm9kdWN0SWQgaW4gcGF0aCcgfSlcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgcHJvZHVjdCA9IHByb2R1Y3RzLmZpbmQoKHApID0+IHAuaWQgPT09IHByb2R1Y3RJZCk7XG5cbiAgaWYgKCFwcm9kdWN0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogJ1Byb2R1Y3Qgbm90IGZvdW5kJyB9KVxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkocHJvZHVjdClcbiAgfTtcbn07XG4iXX0=