from django.db import models

# Create your models here.
from django.db import models

class Users(models.Model):
    USER_TYPE_CHOICES = (
        ('Student', 'Student'),
        ('Instructor', 'Instructor'),
    )

    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    profile_info = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'Users'
        managed = False  # 👈 因为数据库表已经建好了

    def __str__(self):
        return f"{self.username} ({self.user_type})"


class Student(models.Model):
    student = models.OneToOneField(Users, on_delete=models.CASCADE, primary_key=True)

    class Meta:
        db_table = 'Student'
        managed = False

    def __str__(self):
        return f"Student: {self.student.username}"


class Instructor(models.Model):
    instructor = models.OneToOneField(Users, on_delete=models.CASCADE, primary_key=True)

    class Meta:
        db_table = 'Instructor'
        managed = False

    def __str__(self):
        return f"Instructor: {self.instructor.username}"
