import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Vote, Clock, Check, XCircle } from 'lucide-react';
import { useFounderVotes, useCastVote, useFounderVote, type VoteTopic } from '../services';
import { useToast } from '@/hooks/use-toast';

function VoteResults({ topic }: { topic: VoteTopic }) {
  const totalVotes = topic.total_votes || 0;
  
  return (
    <div className="space-y-3">
      {topic.options.map((option) => {
        const count = topic.vote_counts?.[option.id] || 0;
        const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
        const isUserVote = topic.user_voted_option_id === option.id;
        
        return (
          <div key={option.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={`${isUserVote ? 'font-medium text-accent' : 'text-[var(--text-default)]'}`}>
                {option.option_text}
                {isUserVote && <Check className="h-4 w-4 inline ml-1 text-accent" />}
              </span>
              <span className="text-[var(--text-muted)]">
                {count} ({percentage.toFixed(0)}%)
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        );
      })}
      <p className="text-xs text-[var(--text-muted)] pt-2">
        Total: {totalVotes} votos
      </p>
    </div>
  );
}

function VoteCard({ topic: initialTopic }: { topic: VoteTopic }) {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { data: topic } = useFounderVote(initialTopic.id);
  const castVoteMutation = useCastVote();
  
  const currentTopic = topic || initialTopic;
  const deadline = currentTopic.voting_deadline ? new Date(currentTopic.voting_deadline) : null;
  const isPastDeadline = deadline && deadline < new Date();
  const hasVoted = !!currentTopic.user_voted_option_id;
  const isActive = currentTopic.status === 'active' && !isPastDeadline;
  const showResults = hasVoted || isPastDeadline || currentTopic.status === 'closed';

  const handleVote = async () => {
    if (!selectedOption) return;
    
    try {
      await castVoteMutation.mutateAsync({
        topicId: currentTopic.id,
        optionId: selectedOption,
      });
      toast({
        title: 'Voto registrado',
        description: 'Tu voto ha sido registrado exitosamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el voto',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card data-testid={`card-vote-${currentTopic.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium">{currentTopic.title}</CardTitle>
          <Badge 
            variant={isActive ? 'default' : 'secondary'}
            className="shrink-0"
          >
            {isActive ? 'Activa' : 'Cerrada'}
          </Badge>
        </div>
        {currentTopic.description && (
          <p className="text-sm text-[var(--text-muted)]">{currentTopic.description}</p>
        )}
        {deadline && (
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {isPastDeadline ? 'Cerrado' : 'Cierra'}: {format(deadline, "d 'de' MMMM, yyyy", { locale: es })}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {showResults ? (
          <VoteResults topic={currentTopic} />
        ) : (
          <div className="space-y-4">
            <RadioGroup
              value={selectedOption || ''}
              onValueChange={setSelectedOption}
            >
              {currentTopic.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.id}
                    id={`option-${option.id}`}
                    data-testid={`radio-option-${option.id}`}
                  />
                  <Label htmlFor={`option-${option.id}`} className="cursor-pointer">
                    {option.option_text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            <Button
              onClick={handleVote}
              disabled={!selectedOption || castVoteMutation.isPending}
              className="w-full"
              data-testid={`button-vote-${currentTopic.id}`}
            >
              {castVoteMutation.isPending ? 'Votando...' : 'Votar'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VotingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FounderVoting() {
  const { data: votes, isLoading, error } = useFounderVotes();

  if (isLoading) {
    return <VotingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        Error al cargar las votaciones
      </div>
    );
  }

  if (!votes || votes.length === 0) {
    return (
      <div className="text-center py-12">
        <Vote className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" />
        <p className="text-[var(--text-muted)]">
          No hay votaciones disponibles
        </p>
      </div>
    );
  }

  const activeVotes = votes.filter(v => v.status === 'active' && 
    (!v.voting_deadline || new Date(v.voting_deadline) >= new Date()));
  const closedVotes = votes.filter(v => v.status === 'closed' || 
    (v.voting_deadline && new Date(v.voting_deadline) < new Date()));

  return (
    <div className="space-y-6">
      {activeVotes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Votaciones activas
          </h3>
          {activeVotes.map((topic) => (
            <VoteCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}

      {closedVotes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Votaciones cerradas
          </h3>
          {closedVotes.map((topic) => (
            <VoteCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}
