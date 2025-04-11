from django.db import models

# Create your models here.
from django.db import models

class Users(models.Model):
    USER_TYPE_CHOICES = (
        ('Student', 'Student'),
        ('Instructor', 'Instructor'),
    )

    user_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    username = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    profile_info = models.TextField(blank=True, null=True)

    @property
    def id(self):
        return self.user_id

    @property
    def is_authenticated(self):
        return True

    class Meta:
        db_table = 'Users'
        managed = False  # 👈 因为数据库表已经建好了


class Student(models.Model):
    student = models.OneToOneField(Users, on_delete=models.CASCADE, primary_key=True)

    class Meta:
        db_table = 'Student'
        managed = False


class Instructor(models.Model):
    instructor = models.OneToOneField(Users, on_delete=models.CASCADE, primary_key=True)

    class Meta:
        db_table = 'Instructor'
        managed = False


class Student_Exercise(models.Model):
    student_id = models.IntegerField()
    exercise_id = models.IntegerField()
    completed_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(default=0.0)
    submission_count = models.IntegerField(default=0)
    last_submission = models.TextField(null=True, blank=True)
    is_correct = models.BooleanField(default=False)

    class Meta:
        db_table = 'Student_Exercise'
        unique_together = ('student_id', 'exercise_id')

