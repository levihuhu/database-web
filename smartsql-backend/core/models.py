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
    is_completed = models.BooleanField(default=False)

    class Meta:
        db_table = 'Student_Exercise'
        managed = True
        unique_together = ('student_id', 'exercise_id')


class Student_Module(models.Model):
    student_id = models.IntegerField()
    module_id = models.IntegerField()
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    progress = models.FloatField(default=0.0)  # 完成百分比

    class Meta:
        db_table = 'Student_Module'
        managed = True
        unique_together = ('student_id', 'module_id')


class Student_Course(models.Model):
    student_id = models.IntegerField()
    course_id = models.IntegerField()
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    progress = models.FloatField(default=0.0)  # 完成百分比

    class Meta:
        db_table = 'Student_Course'
        managed = True
        unique_together = ('student_id', 'course_id')



class Exercise(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    hint = models.TextField(blank=True, null=True)
    difficulty = models.IntegerField()
    table_schema = models.TextField(blank=True, null=True)  # 根据需求调整类型

    def __str__(self):
        return self.title

class Module(models.Model):
    module_id = models.AutoField(primary_key=True)
    module_name = models.CharField(max_length=100)
    module_description = models.TextField(blank=True, null=True)
    # 根据需要继续添加其他字段

    def __str__(self):
        return self.module_name

