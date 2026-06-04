from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('school', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Chat',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('chat_type', models.CharField(choices=[('private', 'Личный'), ('class', 'Класс')], default='private', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('participant_1', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='private_chats_as_participant_1', to=settings.AUTH_USER_MODEL)),
                ('participant_2', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='private_chats_as_participant_2', to=settings.AUTH_USER_MODEL)),
                ('school_class', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chat', to='school.schoolclass')),
            ],
            options={
                'verbose_name': 'Чат',
                'verbose_name_plural': 'Чаты',
            },
        ),
        migrations.CreateModel(
            name='OnlineStatus',
            fields=[
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='online_status', serialize=False, to=settings.AUTH_USER_MODEL)),
                ('is_online', models.BooleanField(default=False)),
                ('last_seen', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Статус онлайна',
                'verbose_name_plural': 'Статусы онлайна',
            },
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('edited_at', models.DateTimeField(blank=True, null=True)),
                ('chat', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='chats.chat')),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Сообщение',
                'verbose_name_plural': 'Сообщения',
                'ordering': ['created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['chat', '-created_at'], name='chats_messa_chat_id_f5a8c8_idx'),
        ),
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['sender', '-created_at'], name='chats_messa_sender__4c2d5f_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='chat',
            unique_together={('chat_type', 'participant_1', 'participant_2')},
        ),
    ]
