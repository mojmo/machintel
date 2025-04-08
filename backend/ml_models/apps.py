from django.apps import AppConfig

class MlModelsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ml_models'
    
    def ready(self):
        # Initialize predictor on startup
        from .predictor import PredictiveMaintenancePredictor
        self.predictor = PredictiveMaintenancePredictor()