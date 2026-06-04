"""
Django management command to run Daphne server
Usage: python manage.py rundasync
"""
import os
import sys
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Run Daphne ASGI server for WebSockets'

    def add_arguments(self, parser):
        parser.add_argument(
            '--bind', '-b',
            default='0.0.0.0',
            help='The IP address to bind to'
        )
        parser.add_argument(
            '--port', '-p',
            type=int,
            default=8000,
            help='The port to bind to'
        )

    def handle(self, *args, **options):
        bind = options['bind']
        port = options['port']
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Starting Daphne server on {bind}:{port}...'
            )
        )
        self.stdout.write(
            'Press CTRL+C to stop the server\n'
        )

        try:
            from daphne.cli import CommandLineInterface
            sys.argv = [
                'daphne',
                '-b', bind,
                '-p', str(port),
                'config.asgi:application'
            ]
            CommandLineInterface.entrypoint()
        except ImportError:
            raise CommandError(
                'Daphne is not installed. '
                'Run: pip install daphne channels channels-redis'
            )
        except KeyboardInterrupt:
            self.stdout.write('\nServer stopped.')
        except Exception as e:
            raise CommandError(f'Error running server: {e}')
