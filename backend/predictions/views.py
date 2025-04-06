from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .model.predictor import predict

class PredictView(APIView):
    def post(self, request):
        input_data = request.data.get("features")
        if input_data is None:
            return Response({"error": "Missing input data"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            prediction = predict(input_data)
            return Response({"prediction": prediction.tolist()})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
