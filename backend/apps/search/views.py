from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.notes.models import Note
from apps.notes.serializers import NoteSerializer
from apps.books.models import Book
from apps.books.serializers import BookSerializer


class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'notes': [], 'books': []})

        # Advanced syntax: "content:keyword" searches inside note body
        content_search = False
        search_term = query
        if query.lower().startswith('content:'):
            content_search = True
            search_term = query[8:].strip()

        results = {'notes': [], 'books': []}

        if search_term:
            if content_search:
                notes = Note.objects.filter(content__icontains=search_term)
            else:
                notes = Note.objects.filter(title__icontains=search_term)
            results['notes'] = NoteSerializer(notes, many=True).data

            books = Book.objects.filter(title__icontains=search_term)
            if not content_search:
                # Also match by author when doing a plain search
                books = books | Book.objects.filter(author__icontains=search_term)
            results['books'] = BookSerializer(books.distinct(), many=True).data

        return Response(results)
